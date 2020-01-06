import React, { FC } from 'react'
import { useCssHandles } from 'vtex.css-handles'

const CSS_HANDLES = ['challengeContentWrapper'] as const

const BlockContent: FC<ChallengeProps> = ({ children }: ChallengeProps) => {
  const handles = useCssHandles(CSS_HANDLES)
  return (
    <div className={`mw9 center ${handles.challengeContentWrapper}`}>
      {children}
    </div>
  )
}

export default BlockContent
