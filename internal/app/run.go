package app

import (
	"crypto/tls"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"os"

	"github.com/Mmx233/HeyFileGo/v2/internal/router"
	"github.com/Mmx233/HeyFileGo/v2/internal/share"
	"github.com/Mmx233/HeyFileGo/v2/pkg/cert"
	"github.com/Mmx233/HeyFileGo/v2/pkg/netInterface"
)

type Options struct {
	SSL               bool
	Port              uint
	Bind              net.IP
	Path              string
	UploadConcurrency int
}

func apiServer(listener net.Listener, target *share.Target, ssl bool) {
	var err error
	engine := router.Init(target)
	if ssl {
		var certificate tls.Certificate
		certificate, err = cert.Gen()
		if err != nil {
			panic(err)
		}
		srv := &http.Server{
			Handler: engine,
			TLSConfig: &tls.Config{
				Certificates: []tls.Certificate{certificate},
			},
		}
		err = srv.ServeTLS(listener, "", "")
	} else {
		err = http.Serve(listener, engine)
	}
	if err != nil {
		slog.Error("Failed to start HTTP server", "err", err)
		os.Exit(1)
	}
}

func printEth(printer netInterface.Printer, ethUrl *url.URL, target *share.Target) {
	printer.Url(ethUrl)
	if target.Mode() == share.ModeFile {
		downloadUrl := *ethUrl
		downloadUrl.Path = "/api/file/"
		printer.Wget(&downloadUrl, target.FileName())
	}
	printer.Qr(ethUrl)
}

func Run(options Options) error {
	if options.UploadConcurrency < 1 {
		return fmt.Errorf("upload concurrency must be at least 1")
	}
	target, err := share.OpenTarget(options.Path)
	if err != nil {
		return fmt.Errorf("failed to read target path: %w", err)
	}
	defer target.Close()
	if target.Mode() == share.ModeUpload {
		if err := target.SetUploadConcurrency(options.UploadConcurrency); err != nil {
			return err
		}
	}
	slog.Info("Running mode: " + string(target.Mode()))

	var bind string
	if options.Bind != nil {
		bind = options.Bind.String()
	}
	listener, err := net.Listen("tcp", net.JoinHostPort(bind, fmt.Sprint(options.Port)))
	if err != nil {
		return fmt.Errorf("failed to start HTTP listener: %w", err)
	}

	go apiServer(listener, target, options.SSL)

	ethList := []netInterface.Eth{{Ip: bind}}
	if options.Bind == nil || options.Bind.IsUnspecified() {
		ethList, err = netInterface.Load()
	}
	if err != nil {
		slog.Info("Failed to get network interface info", "err", err)
	} else {
		printer := netInterface.NewPrinter().WithEth(options.SSL, fmt.Sprint(listener.Addr().(*net.TCPAddr).Port))

		switch len(ethList) {
		case 0:
			slog.Warn("No available network interface found!")
		case 1:
			printEth(printer.Printer, printer.EthUrl(ethList[0]), target)
		default:
			ethUrlList := printer.EthSelect(ethList)
			for {
				fmt.Printf("Select network interface QR code (index): \n")
				var n int
				_, err := fmt.Scanln(&n)
				if err != nil {
					slog.Error("Failed to read input", "err", err)
					continue
				}
				if len(ethList) <= n || n < 0 {
					slog.Error("Invalid index", "err", err)
					continue
				}
				printEth(printer.Printer, ethUrlList[n], target)
			}
		}
	}
	select {}
}
