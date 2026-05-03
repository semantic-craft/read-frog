import { i18n } from "#imports"
import { useAtom } from "jotai"
import { LanguageCombobox } from "@/components/language-combobox"
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/base-ui/field"
import { configFieldsAtomMap } from "@/utils/atoms/config"
import { ConfigCard } from "../../components/config-card"

export function SubtitlesSourceLanguage() {
  const [videoSubtitlesConfig, setVideoSubtitlesConfig] = useAtom(configFieldsAtomMap.videoSubtitles)

  return (
    <ConfigCard
      id="subtitles-source-language"
      title={i18n.t("options.videoSubtitles.language.title")}
      description={i18n.t("options.videoSubtitles.language.description")}
    >
      <Field>
        <FieldContent>
          <FieldLabel htmlFor="video-subtitles-source-language">
            {i18n.t("options.videoSubtitles.language.sourceLabel")}
          </FieldLabel>
          <LanguageCombobox
            className="w-full"
            value={videoSubtitlesConfig.sourceCode}
            onValueChange={(sourceCode) => {
              void setVideoSubtitlesConfig({ sourceCode })
            }}
            placeholder={i18n.t("options.videoSubtitles.language.placeholder")}
          />
          <FieldDescription>
            {i18n.t("options.videoSubtitles.language.sourceDescription")}
          </FieldDescription>
        </FieldContent>
      </Field>
    </ConfigCard>
  )
}
