import {
  File,
  FileArchive,
  FileAudio,
  FileCode2,
  FileImage,
  FileJson2,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  type LucideIcon,
} from "lucide-react";

const categories = {
  image: ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "ico"],
  video: ["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm"],
  audio: ["mp3", "wav", "flac", "aac", "ogg", "wma"],
  pdf: ["pdf"],
  document: ["doc", "docx", "txt", "rtf", "odt"],
  spreadsheet: ["xls", "xlsx", "csv", "ods"],
  code: [
    "js",
    "ts",
    "jsx",
    "tsx",
    "html",
    "css",
    "scss",
    "less",
    "py",
    "java",
    "c",
    "cpp",
    "h",
    "go",
    "rs",
    "rb",
    "php",
    "sh",
    "bat",
    "ps1",
  ],
  data: ["json", "xml", "yaml", "yml", "toml"],
  archive: ["zip", "rar", "7z", "tar", "gz", "bz2"],
};
const icons: Record<string, LucideIcon> = {
  folder: Folder,
  file: File,
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  pdf: FileText,
  document: FileText,
  spreadsheet: FileSpreadsheet,
  code: FileCode2,
  data: FileJson2,
  archive: FileArchive,
};
export function getFileIconType(filename: string, isDir = false): string {
  if (isDir) return "folder";
  const dot = filename.lastIndexOf(".");
  const extension = dot < 0 ? "" : filename.slice(dot + 1).toLowerCase();
  return (
    Object.entries(categories).find(([, extensions]) =>
      extensions.includes(extension),
    )?.[0] ?? "file"
  );
}
export function getFileIcon(filename: string, isDir = false): LucideIcon {
  return icons[getFileIconType(filename, isDir)];
}
