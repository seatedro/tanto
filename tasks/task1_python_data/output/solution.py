import json
import jsonschema
from jsonschema import validate, ValidationError

def validate_data(schema, data):
    try:
        validate(instance=data, schema=schema)
        return None
    except ValidationError as e:
        errors = []
        for error in e.path:
            path = list(error.schema_path)
            message = e.message
            if e.validator == 'type':
                path.append(error.validator);
                message+= f' Expected type: {error.validator}')
            errors.append({"path": path, "message": message});
        return {"valid": False, "errors": errors}

def apply_transformation(data, transform):
    fields_to_uppercase = transform.get('fields_to_uppercase', [])
    fields_to_remove = transform.get('fields_to_remove', [])

    if fields_to_uppercase or fields_to_remove:
        result = data

        if fields_to_uppercase:
            for field in fields_to_uppercase:
                if field in result and isinstance(result[field], str):
                    result[field] = result[field].upper()

        for field in fields_to_remove:
            if field in result:
                del result[field]

        return result
    return data

def process_json(data):
    schema = data.get('schema')
    input_data = data.get('data',[])
    transform = data.get('transform')

    results = []

    for record in input_data:
        errors = validate_data(schema, record)
        if not errors:
            transformed_data = apply_transformation(record, transform)
            results.append(transformed_data)
        else:
            results.append(errors)

    print(json.dumps(results))
---

jsonschema