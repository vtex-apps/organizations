import React, { FC, useCallback, useMemo } from 'react'
import { Input } from 'vtex.styleguide'

interface Props extends React.ComponentPropsWithoutRef<typeof Input> {
  separator?: string;
  valueAsString?: boolean;
}

const getDigitsFromValue = (value = '') => value.replace(/(-(?!\d))|[^0-9|-]/g, '') || ''

const padDigits = (digits: string) => {
  const desiredLength = 3
  const actualLength = digits.length

  if (actualLength >= desiredLength) {
    return digits

  }

  const amountToAdd = desiredLength - actualLength
  const padding = '0'.repeat(amountToAdd)

  return padding + digits
}

const removeLeadingZeros = (number: string) =>
  number.replace(/^0+([0-9]+)/, '$1')

const addDecimalToNumber = (number: string, separator: string) => {
  const centsStartingPosition = number.length - 2
  const dollars = removeLeadingZeros(number.substring(0, centsStartingPosition))
  const cents = number.substring(centsStartingPosition)

  return dollars + separator + cents
}

const toCurrency = (separator: string, value?: string) => {
  const digits = getDigitsFromValue(value)
  const digitsWithPadding = padDigits(digits)

  return addDecimalToNumber(digitsWithPadding, separator)
}

const CurrencyInput: FC<Props> = ({
  onChange,
  separator = ',',
  value,
  valueAsString,
  ...props
}) => {
  const handleChange = useCallback(
    (event) => {
      const { value: stringValue } = event.target
      const cents = typeof stringValue === 'string' ? parseInt(stringValue.replace(',', ''), 10) : undefined
      event.persist()

      // eslint-disable-next-line prettier/prettier
      onChange?.(({
        target: {
          value: valueAsString ? toCurrency(separator, stringValue) : cents,
        },
      } as unknown) as React.ChangeEvent<HTMLInputElement>)
    },
    [onChange, valueAsString, separator]
  )

  const innerValue = useMemo(() => {
    const stringValue = typeof value === 'number' ? value.toString() : value

    if (stringValue) {
      return toCurrency(separator, stringValue as string)
    }
    return
  }, [value, separator])

  return (
    <Input
      inputMode="numeric"
      pattern="[0-9,]*"
      {...props}
      value={innerValue}
      onChange={handleChange}
    />
  )
}

export default CurrencyInput
