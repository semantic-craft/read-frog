import type { ReactNode } from "react"
import type {
  SubtitlesDisplayMode,
  SubtitlesFontFamily,
  SubtitlesStyle,
  SubtitlesTranslationPosition,
  SubtitleTextStyle,
} from "@/types/config/subtitles"
import { i18n } from "#imports"
import {
  IconLanguage,
  IconPalette,
  IconRefresh,
  IconTypography,
} from "@tabler/icons-react"
import { deepmerge } from "deepmerge-ts"
import { useAtom } from "jotai"
import { use } from "react"
import { Button } from "@/components/ui/base-ui/button"
import { Card } from "@/components/ui/base-ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/base-ui/field"
import { Label } from "@/components/ui/base-ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/base-ui/select"
import { Slider } from "@/components/ui/base-ui/slider"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/base-ui/tooltip"
import { configFieldsAtomMap } from "@/utils/atoms/config"
import {
  DEFAULT_BACKGROUND_OPACITY,
  DEFAULT_DISPLAY_MODE,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SCALE,
  DEFAULT_FONT_WEIGHT,
  DEFAULT_SUBTITLE_COLOR,
  DEFAULT_TRANSLATION_POSITION,
  MAX_BACKGROUND_OPACITY,
  MAX_FONT_SCALE,
  MAX_FONT_WEIGHT,
  MIN_BACKGROUND_OPACITY,
  MIN_FONT_SCALE,
  MIN_FONT_WEIGHT,
} from "@/utils/constants/subtitles"
import { ShadowWrapperContext } from "@/utils/react-shadow-host/create-shadow-host"
import { cn } from "@/utils/styles/utils"

const FONT_FAMILY_OPTIONS: { value: SubtitlesFontFamily, label: string }[] = [
  { value: "system", label: "System Default" },
  { value: "roboto", label: "Roboto" },
  { value: "noto-sans", label: "Noto Sans" },
  { value: "noto-serif", label: "Noto Serif" },
]

const PAGE_SLIDER_ROW_CLASS_NAME = "gap-0"
const PAGE_SLIDER_ROW_CONTENT_CLASS_NAME = "flex flex-col gap-2 @xs/field-group:grid @xs/field-group:grid-cols-[12rem_minmax(0,1fr)] @xs/field-group:items-center @xs/field-group:gap-x-4"
const PAGE_SLIDER_LABEL_CLASS_NAME = "text-sm whitespace-nowrap @xs/field-group:min-w-0"
const PAGE_FIELD_ROW_CLASS_NAME = "gap-0"
const PAGE_FIELD_ROW_CONTENT_CLASS_NAME = "flex flex-col gap-2 @xs/field-group:grid @xs/field-group:grid-cols-[8.5rem_minmax(0,1fr)] @xs/field-group:items-center @xs/field-group:gap-x-4"
const PAGE_FIELD_LABEL_CLASS_NAME = "text-sm whitespace-nowrap @xs/field-group:min-w-0"

type EditorVariant = "page" | "panel"
type TextStyleType = "main" | "translation"

interface SubtitlesStyleEditorProps {
  variant?: EditorVariant
}

interface StyleSectionProps {
  variant: EditorVariant
  title: string
  icon: ReactNode
  onReset: () => void
  children: ReactNode
}

interface GeneralControlsProps {
  style: SubtitlesStyle
  variant: EditorVariant
  popupContainer: HTMLElement | null
  updateStyle: (style: Partial<SubtitlesStyle>) => void
}

interface TextStyleControlsProps {
  textStyle: SubtitleTextStyle
  type: TextStyleType
  variant: EditorVariant
  popupContainer: HTMLElement | null
  updateStyle: (style: Partial<SubtitleTextStyle>) => void
}

export function SubtitlesStyleEditor({ variant = "page" }: SubtitlesStyleEditorProps) {
  const [videoSubtitlesConfig, setVideoSubtitlesConfig] = useAtom(configFieldsAtomMap.videoSubtitles)
  const popupContainer = use(ShadowWrapperContext)
  const { style } = videoSubtitlesConfig

  const updateStyle = (nextStyle: Partial<SubtitlesStyle>) => {
    void setVideoSubtitlesConfig(deepmerge(videoSubtitlesConfig, { style: nextStyle }))
  }

  const resetGeneralStyle = () => {
    updateStyle({
      displayMode: DEFAULT_DISPLAY_MODE,
      translationPosition: DEFAULT_TRANSLATION_POSITION,
      container: {
        backgroundOpacity: DEFAULT_BACKGROUND_OPACITY,
      },
    })
  }

  const resetTextStyle = (type: TextStyleType) => {
    updateStyle({
      [type]: {
        fontFamily: DEFAULT_FONT_FAMILY,
        fontScale: DEFAULT_FONT_SCALE,
        color: DEFAULT_SUBTITLE_COLOR,
        fontWeight: DEFAULT_FONT_WEIGHT,
      },
    })
  }

  const sectionLayoutClassName = variant === "page"
    ? "mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    : "flex flex-col gap-3"

  return (
    <div className={sectionLayoutClassName}>
      <StyleSection
        variant={variant}
        title={i18n.t("options.videoSubtitles.style.generalSettings")}
        icon={<IconPalette className="size-4" />}
        onReset={resetGeneralStyle}
      >
        <GeneralControls
          style={style}
          variant={variant}
          popupContainer={popupContainer}
          updateStyle={updateStyle}
        />
      </StyleSection>

      <StyleSection
        variant={variant}
        title={i18n.t("options.videoSubtitles.style.mainSubtitle")}
        icon={<IconTypography className="size-4" />}
        onReset={() => resetTextStyle("main")}
      >
        <TextStyleControls
          textStyle={style.main}
          type="main"
          variant={variant}
          popupContainer={popupContainer}
          updateStyle={nextStyle => updateStyle({ main: deepmerge(style.main, nextStyle) })}
        />
      </StyleSection>

      <StyleSection
        variant={variant}
        title={i18n.t("options.videoSubtitles.style.translationSubtitle")}
        icon={<IconLanguage className="size-4" />}
        onReset={() => resetTextStyle("translation")}
      >
        <TextStyleControls
          textStyle={style.translation}
          type="translation"
          variant={variant}
          popupContainer={popupContainer}
          updateStyle={nextStyle => updateStyle({ translation: deepmerge(style.translation, nextStyle) })}
        />
      </StyleSection>
    </div>
  )
}

function StyleSection({
  variant,
  title,
  icon,
  onReset,
  children,
}: StyleSectionProps) {
  const resetLabel = i18n.t("options.videoSubtitles.style.reset")

  const header = (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className={cn(
          "flex shrink-0 items-center justify-center rounded-full",
          variant === "page"
            ? "size-8 bg-muted text-foreground/75"
            : "size-8 border border-white/10 bg-white/[0.045] text-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        )}
        >
          {icon}
        </div>
        <Label className={cn(
          "font-semibold",
          variant === "page" ? "text-sm" : "text-[13px] text-white/92",
        )}
        >
          {title}
        </Label>
      </div>

      <Tooltip>
        <TooltipTrigger
          render={(
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(
                variant === "page"
                  ? "-mr-2"
                  : "rounded-full border border-white/10 bg-white/[0.03] text-white/62 hover:border-white/14 hover:bg-white/[0.08] hover:text-white",
              )}
              aria-label={resetLabel}
              onClick={onReset}
            />
          )}
        >
          <IconRefresh className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>{resetLabel}</TooltipContent>
      </Tooltip>
    </div>
  )

  if (variant === "page") {
    return (
      <Card className="p-5">
        {header}
        {children}
      </Card>
    )
  }

  return (
    <div className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.05)]">
      {header}
      {children}
    </div>
  )
}

function GeneralControls({
  style,
  variant,
  popupContainer,
  updateStyle,
}: GeneralControlsProps) {
  const { displayMode, translationPosition, container } = style
  const fieldLabelClassName = variant === "page"
    ? PAGE_SLIDER_LABEL_CLASS_NAME
    : "text-[12px] font-medium tracking-[0.02em] text-white/60"
  const sliderRowClassName = variant === "page" ? PAGE_SLIDER_ROW_CLASS_NAME : "gap-0"
  const sliderRowContentClassName = variant === "page"
    ? PAGE_SLIDER_ROW_CONTENT_CLASS_NAME
    : "grid gap-2.5 md:grid-cols-[8.75rem_minmax(0,1fr)] md:items-center md:gap-x-4"
  const selectTriggerClassName = variant === "page"
    ? "h-8"
    : "h-9 w-full"
  const sliderClassName = variant === "page"
    ? "flex-1"
    : "flex-1 [&_[data-slot=slider-track]]:bg-white/[0.08] [&_[data-slot=slider-range]]:bg-white/85 [&_[data-slot=slider-thumb]]:border-white/50 [&_[data-slot=slider-thumb]]:bg-white"
  const valueClassName = variant === "page"
    ? "w-10 text-sm text-right"
    : "w-12 text-right text-xs font-medium tracking-[0.04em] text-white/56"
  const selectVariant = variant === "panel" ? "panel" : "default"

  return (
    <FieldGroup>
      <Field orientation={variant === "page" ? "responsive-compact" : "vertical"}>
        <FieldLabel className={fieldLabelClassName}>{i18n.t("options.videoSubtitles.style.displayMode.title")}</FieldLabel>
        <Select
          value={displayMode}
          onValueChange={(value) => {
            if (value) {
              updateStyle({ displayMode: value as SubtitlesDisplayMode })
            }
          }}
        >
          <SelectTrigger className={selectTriggerClassName} variant={selectVariant}>
            <SelectValue>
              {i18n.t(`options.videoSubtitles.style.displayMode.${displayMode}`)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent container={popupContainer} variant={selectVariant}>
            <SelectGroup>
              <SelectItem variant={selectVariant} value="bilingual">
                {i18n.t("options.videoSubtitles.style.displayMode.bilingual")}
              </SelectItem>
              <SelectItem variant={selectVariant} value="originalOnly">
                {i18n.t("options.videoSubtitles.style.displayMode.originalOnly")}
              </SelectItem>
              <SelectItem variant={selectVariant} value="translationOnly">
                {i18n.t("options.videoSubtitles.style.displayMode.translationOnly")}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      {displayMode === "bilingual" && (
        <Field orientation={variant === "page" ? "responsive-compact" : "vertical"}>
          <FieldLabel className={fieldLabelClassName}>{i18n.t("options.videoSubtitles.style.translationPosition.title")}</FieldLabel>
          <Select
            value={translationPosition}
            onValueChange={(value) => {
              if (value) {
                updateStyle({ translationPosition: value as SubtitlesTranslationPosition })
              }
            }}
          >
            <SelectTrigger className={selectTriggerClassName} variant={selectVariant}>
              <SelectValue>
                {i18n.t(`options.videoSubtitles.style.translationPosition.${translationPosition}`)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent container={popupContainer} variant={selectVariant}>
              <SelectGroup>
                <SelectItem variant={selectVariant} value="above">
                  {i18n.t("options.videoSubtitles.style.translationPosition.above")}
                </SelectItem>
                <SelectItem variant={selectVariant} value="below">
                  {i18n.t("options.videoSubtitles.style.translationPosition.below")}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      )}

      <Field className={sliderRowClassName}>
        <div className={sliderRowContentClassName}>
          <FieldLabel className={fieldLabelClassName}>{i18n.t("options.videoSubtitles.style.backgroundOpacity")}</FieldLabel>
          <div className={cn(
            "w-full min-w-0",
            variant === "page" && "@xs/field-group:ml-auto @xs/field-group:max-w-[15rem]",
          )}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Slider
                min={MIN_BACKGROUND_OPACITY}
                max={MAX_BACKGROUND_OPACITY}
                step={5}
                value={container.backgroundOpacity}
                onValueChange={value => updateStyle({ container: { backgroundOpacity: value as number } })}
                className={sliderClassName}
              />
              <span className={valueClassName}>
                {container.backgroundOpacity}
                %
              </span>
            </div>
          </div>
        </div>
      </Field>
    </FieldGroup>
  )
}

function TextStyleControls({
  textStyle,
  type,
  variant,
  popupContainer,
  updateStyle,
}: TextStyleControlsProps) {
  const fieldRowClassName = variant === "page" ? PAGE_FIELD_ROW_CLASS_NAME : "gap-0"
  const fieldRowContentClassName = variant === "page"
    ? PAGE_FIELD_ROW_CONTENT_CLASS_NAME
    : "grid gap-2.5 md:grid-cols-[8.75rem_minmax(0,1fr)] md:items-center md:gap-x-4"
  const fieldLabelClassName = variant === "page"
    ? PAGE_FIELD_LABEL_CLASS_NAME
    : "text-[12px] font-medium tracking-[0.02em] text-white/60"
  const selectTriggerClassName = variant === "page"
    ? "h-8 w-full"
    : "h-9 w-full"
  const sliderClassName = variant === "page"
    ? "flex-1"
    : "flex-1 [&_[data-slot=slider-track]]:bg-white/[0.08] [&_[data-slot=slider-range]]:bg-white/85 [&_[data-slot=slider-thumb]]:border-white/50 [&_[data-slot=slider-thumb]]:bg-white"
  const valueClassName = variant === "page"
    ? "w-10 text-sm text-right"
    : "w-12 text-right text-xs font-medium tracking-[0.04em] text-white/56"
  const colorInputClassName = variant === "page"
    ? "!w-8 h-8 p-0.5 rounded border border-input cursor-pointer"
    : "h-9 w-12 cursor-pointer rounded-xl border border-white/12 bg-transparent p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
  const selectVariant = variant === "panel" ? "panel" : "default"

  return (
    <FieldGroup>
      <Field className={fieldRowClassName}>
        <div className={fieldRowContentClassName}>
          <FieldLabel className={fieldLabelClassName}>{i18n.t("options.videoSubtitles.style.fontFamily")}</FieldLabel>
          <div className="min-w-0">
            <Select
              value={textStyle.fontFamily}
              onValueChange={(value) => {
                if (value) {
                  updateStyle({ fontFamily: value as SubtitlesFontFamily })
                }
              }}
            >
              <SelectTrigger className={selectTriggerClassName} variant={selectVariant}>
                <SelectValue>
                  {FONT_FAMILY_OPTIONS.find(option => option.value === textStyle.fontFamily)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent container={popupContainer} variant={selectVariant}>
                <SelectGroup>
                  {FONT_FAMILY_OPTIONS.map(option => (
                    <SelectItem key={option.value} variant={selectVariant} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Field>

      <Field className={fieldRowClassName}>
        <div className={fieldRowContentClassName}>
          <FieldLabel className={fieldLabelClassName}>{i18n.t("options.videoSubtitles.style.fontScale")}</FieldLabel>
          <div className="flex min-w-0 items-center gap-2.5">
            <Slider
              min={MIN_FONT_SCALE}
              max={MAX_FONT_SCALE}
              step={10}
              value={textStyle.fontScale}
              onValueChange={value => updateStyle({ fontScale: value as number })}
              className={sliderClassName}
            />
            <span className={valueClassName}>
              {textStyle.fontScale}
              %
            </span>
          </div>
        </div>
      </Field>

      <Field className={fieldRowClassName}>
        <div className={fieldRowContentClassName}>
          <FieldLabel className={fieldLabelClassName}>{i18n.t("options.videoSubtitles.style.fontWeight")}</FieldLabel>
          <div className="flex min-w-0 items-center gap-2.5">
            <Slider
              min={MIN_FONT_WEIGHT}
              max={MAX_FONT_WEIGHT}
              step={100}
              value={textStyle.fontWeight}
              onValueChange={value => updateStyle({ fontWeight: value as number })}
              className={sliderClassName}
            />
            <span className={valueClassName}>{textStyle.fontWeight}</span>
          </div>
        </div>
      </Field>

      <Field className={fieldRowClassName}>
        <div className={fieldRowContentClassName}>
          <FieldLabel className={fieldLabelClassName}>{i18n.t("options.videoSubtitles.style.color")}</FieldLabel>
          <div className={cn(
            "flex min-w-0",
            variant === "page" ? "@xs/field-group:justify-end" : "md:justify-end",
          )}
          >
            <input
              type="color"
              aria-label={i18n.t(`options.videoSubtitles.style.${type === "main" ? "mainSubtitle" : "translationSubtitle"}`)}
              value={textStyle.color}
              onChange={e => updateStyle({ color: e.target.value })}
              className={colorInputClassName}
            />
          </div>
        </div>
      </Field>
    </FieldGroup>
  )
}
