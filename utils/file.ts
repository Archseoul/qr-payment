/**
 * 파일 다운로드 유틸리티 함수
 * @param blob - 다운로드할 파일의 Blob 데이터
 * @param fileName - 다운로드될 파일명
 */
export const downloadFile = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('download', fileName)
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
