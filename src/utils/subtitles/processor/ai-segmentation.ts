import type { SubtitlesFragment } from '../types'
import type { Config } from '@/types/config/config'
import { sendMessage } from '@/utils/message'
import { enforceCueGuards } from './ai-segmentation/guards'
import {
  cleanFragmentsForAi,
  formatFragmentsToJson,
  parseLineProtocolToUnits,
  validateSegmentationUnits,
} from './ai-segmentation/protocol'
import { buildFragmentsFromUnits, refineSegmentationUnits } from './ai-segmentation/refine'

export async function aiSegmentBlock(
  fragments: SubtitlesFragment[],
  config: Config,
): Promise<SubtitlesFragment[]> {
  if (fragments.length === 0) {
    return fragments
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

  const refinedUnits = refineSegmentationUnits(units, cleanedFragments)
  validateSegmentationUnits(refinedUnits, cleanedFragments.length)

  const rebuiltFragments = buildFragmentsFromUnits(refinedUnits, cleanedFragments)
  return enforceCueGuards(rebuiltFragments)
}
