import { createWorker } from 'tesseract.js'
import { extractPlaceNameCandidates } from './extractPlaceNames'

export type OcrProgress = {
  status: string
  progress: number
}

/**
 * 이미지에서 OCR → 장소명 후보 추출 (브라우저, tesseract.js)
 * 언어: 한국어 + 영어
 */
export async function ocrImageToPlaceNames(
  source: File | Blob | string,
  onProgress?: (p: OcrProgress) => void,
): Promise<{ text: string; names: string[] }> {
  const worker = await createWorker('kor+eng', 1, {
    logger: (m) => {
      if (!onProgress) return
      if (typeof m.progress === 'number') {
        onProgress({
          status: String(m.status || 'recognizing'),
          progress: m.progress,
        })
      }
    },
  })

  try {
    const result = await worker.recognize(source)
    const text = result.data.text || ''
    const names = extractPlaceNameCandidates(text)
    return { text, names }
  } finally {
    await worker.terminate()
  }
}
