interface QuestionBannerProps {
  id: string
  labelId: string
  equationId: string
  labelText?: string
}

export default function QuestionBanner({
  id,
  labelId,
  equationId,
  labelText = '在空格內填上正確的數字',
}: QuestionBannerProps) {
  return (
    <div className="question-banner" id={id}>
      <div className="q-label" id={labelId}>{labelText}</div>
      <div className="q-equation" id={equationId} />
    </div>
  )
}
