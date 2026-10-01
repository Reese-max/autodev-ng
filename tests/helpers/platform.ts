/** 這個 repo 的 CI 是 windows-latest，部分行為（taskkill 樹斬、wmic/CIM、.NET 檔案鎖、
 *  cmd.exe 的 exit 9009）在 POSIX 沒有同義實作，無法在 Linux 主機上成立。
 * 依賴那些行為的規格用 skipIf(!win32Only) 略過——Windows CI 照常執行、斷言不減。 */
export const win32Only = process.platform === 'win32'