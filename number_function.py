def get_big_number(input_value):
    """Takes input and returns a big number based on the input."""
    if isinstance(input_value, (int, float)):
        return input_value * 10**9
    else:
        return len(str(input_value)) * 10**9
