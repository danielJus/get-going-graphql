import { SchemaDirectiveVisitor } from "apollo-server"

class UniqueDirective extends SchemaDirectiveVisitor {
  getMutations(predicate = null) {
    if (!this._mutations) {
      this._mutations = Object.values(this.schema.getMutationType().getFields())
    }
    if (!predicate) {
      return this._mutations || []
    }
    return this._mutations.filter(predicate)
  }

  getMutationArgumentValue(fieldName, args) {
    const argTuples = Object.entries(args)
    for (let i = 0; i < argTuples.length; i++) {
      const [key, value] = argTuples[i]
      if (value !== null && typeof value === "object") {
        return this.getMutationArgumentValue(fieldName, value)
      } else if (key === fieldName) {
        return value
      }
    }
    return null
  }

  visitInputFieldDefinition(field, { objectType }) {
    // Field-validating code goes here...
  }
}
export default UniqueDirective
