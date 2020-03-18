declare module 'vtex.styleguide' {
  import { ComponentType } from 'react'
  export const Button: ComponentType<InputProps>
  export const Dropdown: ComponentType<InputProps>
  export const Input: ComponentType<InputProps>
  export const Table: ComponentType<InputProps>
  export const EmptyState: ComponentType<InputProps>
  export const PageHeader: ComponentType<InputProps>
  export const Layout: ComponentType<InputProps>
  export const PageBlock: ComponentType<InputProps>
  export const Divider: ComponentType<InputProps>
  export const ButtonWithIcon: ComponentType<InputProps>
  export const IconCheck: ComponentType<InputProps>
  export const Modal: ComponentType<InputProps>
  export const ModalDialog: ComponentType<InputProps>
  export const Alert: ComponentType<InputProps>
  export const ToastProvider: ComponentType<InputProps>
  export const ToastConsumer: ComponentType<InputProps>
  export const Spinner: ComponentType<InputProps>
  export const Tag: ComponentType<InputProps>
  export const Collapsible: ComponentType<InputProps>
  export const Checkbox: ComponentType<InputProps>

  interface InputProps {
    [key: string]: any
  }
}
