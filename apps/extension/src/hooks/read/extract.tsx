import type { ExtractedContent } from '@/types/content'
import { useQuery } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { configFields } from '@/utils/atoms/config'
import { getDocumentInfo } from '@/utils/content'
import { logger } from '@/utils/logger'

export function useExtractContent() {
  const setLanguage = useSetAtom(configFields.language)

  return useQuery<ExtractedContent | null>({
    queryKey: ['extractContent'],
    queryFn: async () => {
      try {
        const { article, paragraphs, lang, detectedCode } = getDocumentInfo()
        void setLanguage({ detectedCode })

        return {
          article: {
            ...article,
            lang,
          },
          paragraphs,
        }
      }
      catch (error) {
        logger.error('Failed to extract content from document:', error)
        return null
      }
    },
  })
}
