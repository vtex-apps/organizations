import { useRef, useEffect, FC } from 'react'
import { injectIntl } from 'react-intl'

interface RenderProps {
  name: string
  path: string
}

interface Props {
  render: (paths: RenderProps[]) => any
  intl: any
}

const myUsersLink: FC<Props>  = ({ render, intl }: Props) => {

  const first_load = useRef(false)

  useEffect(() => {
    if(!first_load.current){
      console.log('this is link first load')
      first_load.current = false
    }
  })

  return render([
    {
      name: intl.formatMessage({ id: 'store/my-users.link' }),
      path: '/users',
    },
  ])
}

export default injectIntl(myUsersLink)
