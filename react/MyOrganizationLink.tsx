import { FC } from 'react'
import { injectIntl } from 'react-intl'

interface RenderProps {
  name: string
  path: string
}

interface Props {
  render: (paths: RenderProps[]) => any
  intl: any
}

const MyOrganizationLink: FC<Props> = ({ render, intl }: Props) => {
  return render([
    {
      name: intl.formatMessage({ id: 'store/my-organization.link' }),
      path: '/myorganization',
    },
  ])
}

export default injectIntl(MyOrganizationLink)
