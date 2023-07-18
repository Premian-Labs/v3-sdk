export type JSONValue = string | number | boolean | JSONObject | JSONArray | JSONReference
export type JSONContainer = JSONObject | JSONArray

export interface JSONObject {
  [x: string]: JSONValue
}

export interface JSONReference {
  $ref: string
}

export interface JSONArray extends Array<JSONValue> {}

/// Convert list of dot-notated strings to a nested json object
export function stringListToJson(list: string[]): JSONObject {
  const obj = {}
  list.forEach((key) => {
    const keys = key.split('.')
    keys.reduce((acc: JSONObject, cur: string, i) => {
      if (i === keys.length - 1) {
        acc[cur] = true
      } else {
        acc[cur] = acc[cur] || {}
      }
      return acc[cur]
    }, obj)
  })
  return obj as JSONObject
}

function isReference(obj: any): obj is JSONReference {
  return obj && typeof obj === 'object' && '$ref' in obj
}

function getReferencedValue(obj: JSONContainer, path: string[]): JSONValue {
  let currentObj: JSONValue = obj
  for (const part of path) {
    if (Array.isArray(currentObj)) {
      currentObj = currentObj[parseInt(part)]
    } else if (typeof currentObj === 'object') {
      currentObj = (currentObj as JSONObject)[part]
    }
  }
  return currentObj
}

export function resolveReferences(jsonObj: JSONObject): JSONObject {
  function innerResolve(obj: JSONObject): JSONObject {
    const newObj: JSONObject = {}

    for (const key in obj) {
      const value = obj[key]
      if (isReference(value)) {
        const referencePath = value.$ref.split('/').slice(1)
        newObj[key] = getReferencedValue(jsonObj, referencePath)
      } else if (Array.isArray(value)) {
        newObj[key] = value.map((item) => {
          if (typeof item === 'object') {
            return innerResolve(item as JSONObject)
          }
          return item
        })
      } else if (typeof value === 'object') {
        newObj[key] = innerResolve(value)
      } else {
        newObj[key] = value
      }
    }

    return newObj
  }

  return innerResolve(jsonObj)
}
