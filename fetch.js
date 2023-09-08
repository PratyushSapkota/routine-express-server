fetch('http://localhost:5003/auth/users', {
    method: "POST",
    headers: { 'Content-type': 'application/json' },
    body: JSON.stringify({ "username": 'pratyush', "password": "simplepassword" })
}).then((res) => {
    res.json()
}).then((response) => {
    console.log(response)
})