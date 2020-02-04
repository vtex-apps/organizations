import {
  fieldResolvers as documentFieldResolvers,
  mutations as documentMutations,
  queries as documentQueries,
} from './document'


export const resolvers = {
  ...documentFieldResolvers,
  Mutation: {
    ...documentMutations,
  },
  Query: {
    ...documentQueries
  },
}
