import type { SubtitlesFragment } from '../../types'
import type { Config } from '@/types/config/config'
import { sendMessage } from '@/utils/message'
import { enforceCueGuards } from './guards'
import {
  cleanFragmentsForAi,
  formatFragmentsToJson,
  parseLineProtocolToUnits,
  validateSegmentationUnits,
} from './protocol'
import { buildFragmentsFromUnits, refineSegmentationUnits } from './refine'

export async function aiSegmentBlock(
  fragments: SubtitlesFragment[],
  config: Config,
  sourceLanguage: string,
): Promise<SubtitlesFragment[]> {
  if (fragments.length === 0) {
    return fragments
  }
  if (!sourceLanguage.trim()) {
    throw new Error('sourceLanguage is required for AI segmentation')
  }

  const cleanedFragments = cleanFragmentsForAi(fragments)
  if (cleanedFragments.length === 0) {
    return fragments
  }

  const jsonContent = formatFragmentsToJson(cleanedFragments)
  const segmentedOutput = await sendMessage('aiSegmentSubtitles', {
    jsonContent,
    providerId: config.translate.providerId,
  })

  const units = parseLineProtocolToUnits(segmentedOutput)
  validateSegmentationUnits(units, cleanedFragments.length)

  const refinedUnits = refineSegmentationUnits(units, cleanedFragments, sourceLanguage)
  validateSegmentationUnits(refinedUnits, cleanedFragments.length)

  const rebuiltFragments = buildFragmentsFromUnits(refinedUnits, cleanedFragments)
  return enforceCueGuards(rebuiltFragments, sourceLanguage)
}
