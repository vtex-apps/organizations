import { endsWith, isEmpty, isNil } from 'ramda'

export const documentSerializer = (documents: any) => {
  if (!documents || documents.length === 0) {
    return []
  }

  const fieldReducer = (fieldsAccumulator: any, field: any) => {
    if(!endsWith('_linked', field.key)) {
      fieldsAccumulator[field.key] = field.value
    }
    if(endsWith('_linked', field.key) && !isNil(field.value) && !isEmpty(field.value)){
      fieldsAccumulator[field.key] = JSON.parse(field.value)
    }
    return fieldsAccumulator
  }

  const documentReducer = (documentAccumulator: any, document: any) => {
    documentAccumulator.push(document.fields.reduce(fieldReducer, {}))
    return documentAccumulator
  }

  return documents.reduce(documentReducer, [])
}
