import { injectIntl } from 'react-intl'

interface RenderProps {
  name: string
  path: string
}

interface Props {
  render: (paths: RenderProps[]) => any
  intl: any
}

const MyUsersLink = ({ render, intl }: Props) => {
  return render([
    {
      name: intl.formatMessage({ id: 'store/my-users.link' }),
      path: '/users',
    },
  ])
}

export default injectIntl(MyUsersLink)
