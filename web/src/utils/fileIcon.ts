import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import DataObjectIcon from '@mui/icons-material/DataObject';
import TableChartIcon from '@mui/icons-material/TableChart';
import type { SvgIconComponent } from '@mui/icons-material';

export type FileIconType = SvgIconComponent;

// Extension to icon type mapping
const extensionMap: Record<string, FileIconType> = {
  // Images
  jpg: ImageIcon,
  jpeg: ImageIcon,
  png: ImageIcon,
  gif: ImageIcon,
  bmp: ImageIcon,
  svg: ImageIcon,
  webp: ImageIcon,
  ico: ImageIcon,

  // Videos
  mp4: VideoFileIcon,
  avi: VideoFileIcon,
  mkv: VideoFileIcon,
  mov: VideoFileIcon,
  wmv: VideoFileIcon,
  flv: VideoFileIcon,
  webm: VideoFileIcon,

  // Audio
  mp3: AudioFileIcon,
  wav: AudioFileIcon,
  flac: AudioFileIcon,
  aac: AudioFileIcon,
  ogg: AudioFileIcon,
  wma: AudioFileIcon,

  // Documents
  pdf: PictureAsPdfIcon,
  doc: DescriptionIcon,
  docx: DescriptionIcon,
  txt: DescriptionIcon,
  rtf: DescriptionIcon,
  odt: DescriptionIcon,

  // Spreadsheets
  xls: TableChartIcon,
  xlsx: TableChartIcon,
  csv: TableChartIcon,
  ods: TableChartIcon,

  // Code
  js: CodeIcon,
  ts: CodeIcon,
  jsx: CodeIcon,
  tsx: CodeIcon,
  html: CodeIcon,
  css: CodeIcon,
  scss: CodeIcon,
  less: CodeIcon,
  py: CodeIcon,
  java: CodeIcon,
  c: CodeIcon,
  cpp: CodeIcon,
  h: CodeIcon,
  go: CodeIcon,
  rs: CodeIcon,
  rb: CodeIcon,
  php: CodeIcon,
  sh: CodeIcon,
  bat: CodeIcon,
  ps1: CodeIcon,

  // Data
  json: DataObjectIcon,
  xml: DataObjectIcon,
  yaml: DataObjectIcon,
  yml: DataObjectIcon,
  toml: DataObjectIcon,

  // Archives
  zip: FolderZipIcon,
  rar: FolderZipIcon,
  '7z': FolderZipIcon,
  tar: FolderZipIcon,
  gz: FolderZipIcon,
  bz2: FolderZipIcon,
};

/**
 * Get the file extension from a filename
 * @param filename - The filename to extract extension from
 * @returns The lowercase extension without the dot, or empty string
 */
function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return '';
  }
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Get the appropriate icon component for a file based on its name
 * @param filename - The filename to get icon for
 * @param isDir - Whether the item is a directory
 * @returns The MUI icon component
 */
export function getFileIcon(filename: string, isDir: boolean = false): FileIconType {
  if (isDir) {
    return FolderIcon;
  }

  const ext = getExtension(filename);
  return extensionMap[ext] || InsertDriveFileIcon;
}

/**
 * Get the icon type name for a file (useful for testing)
 * @param filename - The filename to get icon type for
 * @param isDir - Whether the item is a directory
 * @returns The icon type name string
 */
export function getFileIconType(filename: string, isDir: boolean = false): string {
  if (isDir) {
    return 'folder';
  }

  const ext = getExtension(filename);
  if (!ext) return 'file';

  // Map extensions to type categories
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'];
  const videoExts = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'];
  const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'];
  const docExts = ['doc', 'docx', 'txt', 'rtf', 'odt'];
  const spreadsheetExts = ['xls', 'xlsx', 'csv', 'ods'];
  const codeExts = ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'less', 'py', 'java', 'c', 'cpp', 'h', 'go', 'rs', 'rb', 'php', 'sh', 'bat', 'ps1'];
  const dataExts = ['json', 'xml', 'yaml', 'yml', 'toml'];
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];

  if (ext === 'pdf') return 'pdf';
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  if (docExts.includes(ext)) return 'document';
  if (spreadsheetExts.includes(ext)) return 'spreadsheet';
  if (codeExts.includes(ext)) return 'code';
  if (dataExts.includes(ext)) return 'data';
  if (archiveExts.includes(ext)) return 'archive';

  return 'file';
}
