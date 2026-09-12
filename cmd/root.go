package cmd

import (
	"fmt"
	"net"

	"github.com/Mmx233/HeyFileGo/v2/internal/app"
	"github.com/spf13/cobra"
)

func Execute(version string) error {
	var options app.Options
	// Allow double-click and drag-and-drop launches from Windows Explorer.
	cobra.MousetrapHelpText = ""
	rootCmd := &cobra.Command{
		Use:     "HeyFileGo [path]",
		Short:   "A lightweight file transfer tool.",
		Version: version,
		Args:    cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			cmd.SilenceUsage = true
			if len(args) > 0 {
				options.Path = args[0]
			}
			return app.Run(options)
		},
	}
	rootCmd.SetVersionTemplate("{{.Version}}\n")

	flags := rootCmd.Flags()
	flags.BoolVarP(&options.SSL, "ssl", "s", false, "Enable tls for transfer.")
	flags.UintVarP(&options.Port, "port", "p", 0, "Specify port.")
	// pflag's IPVar accepts empty values, which must not enable wildcard listening.
	flags.Func("bind", "`IP` address to listen on (default: all interfaces).", func(value string) error {
		ip := net.ParseIP(value)
		if ip == nil {
			return fmt.Errorf("%q is not an IP address", value)
		}
		options.Bind = ip
		return nil
	})
	return rootCmd.Execute()
}
