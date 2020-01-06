import { injectIntl, InjectedIntlProps } from 'react-intl'

interface RenderProps {
  name: string
  path: string
}

interface Props {
  render: (paths: RenderProps[]) => any
}

const MyUsersLink = ({ render, intl }: Props & InjectedIntlProps) => {
  return render([
    {
      name: intl.formatMessage({ id: 'store/my-users.link' }),
      path: '/users',
    },
  ])
}

export default injectIntl(MyUsersLink)
