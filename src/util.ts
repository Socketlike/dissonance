export interface Reference<T> {
  value: T
}

export function createRef<T>(value: T): Reference<T> {
  return { value }
}

export function createRefs<T>(...values: T[]): Array<Reference<T>> {
  return values.map((value) => createRef(value))
}

export function unpackRefs<T>(...refs: Array<Reference<T>>): T[] {
  return refs.map((ref) => ref.value)
}
