document.querySelectorAll('input[name="amount"]').forEach((input) => {
    input.addEventListener('blur', () => {
        if (input.value && !input.value.includes(',')) {
            input.value = input.value.replace('.', ',')
        }
    })
})
