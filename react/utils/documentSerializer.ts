import { endsWith } from 'ramda'

export const documentSerializer = (documents: any) => {
  if (!documents) {
    return []
  }

  const fieldReducer = (fieldsAccumulator: any, field: any) => {
    if (!endsWith('_linked', field.key)) {
      fieldsAccumulator[field.key] = field.value
    }
    if (endsWith('_linked', field.key)) {
      fieldsAccumulator[field.key] = JSON.parse(field.value)
    }
    return fieldsAccumulator
  }

  const documentReducer = (documentAccumulator: any, document: any) => {
    if (!document || !document.fields) {
      return documentAccumulator
    }
    documentAccumulator.push(document.fields.reduce(fieldReducer, {}))
    return documentAccumulator
  }

  return documents.reduce(documentReducer, [])
}
