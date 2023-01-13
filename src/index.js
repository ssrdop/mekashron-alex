const { xml2json } = require('xml-js')

const getResultBlock = () => document.getElementById("result")

const dropStyles = (node, classStartsWith) => {
    node.classList.forEach(cl => {
        if (cl.startsWith(classStartsWith)) {
            node.classList.remove(cl)
        }
    })
}

const manageAnswer = (content, resultClass) => {
    document.getElementById("login-form-wrapper").style.display = 'none'
    document.getElementById("result").style.display = 'block'

    const resultBlock = getResultBlock()
    dropStyles(resultBlock, "result--")

    resultBlock.innerHTML = content
    resultBlock.classList.add(resultClass)
}

const manageError = (message = "its error") => {
    const errorContent = `<div>${message}</div>`

    manageAnswer(errorContent, "result--error")
}

const manageSuccess = (response) => {
    const responseJson = JSON.parse(xml2json(response.responseText, { spaces: 2, compact: true }))

    let personData = undefined

    try {
        const loggingResult =  JSON.parse(responseJson["SOAP-ENV:Envelope"]["SOAP-ENV:Body"]["NS1:LoginResponse"]["return"]["_text"])

        if (loggingResult["ResultCode"] === -1) {
            manageError("The user with this username and password was not found")
            return
        }

        personData = loggingResult
    } catch (e) {
        manageError("An error occurred while parsing the data from server")
        return
    }

    if (personData === undefined) return

    const template = `<div>${personData.FirstName} ${personData.LastName} you succesfully logged in. Your email is ${personData.Email} and your mobile is ${personData.Mobile}<div>`
    manageAnswer(template, "result--success")
}

function soapLogin(login, password) {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.open('POST', 'http://isapi.icu-tech.com/icutech-test.dll/soap/IICUTech', true);

    const body =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope" xmlns:ns1="urn:ICUTech.Intf-IICUTech" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:enc="http://www.w3.org/2003/05/soap-encoding">' +
        '  <env:Body>' +
        '    <ns1:Login env:encodingStyle="http://www.w3.org/2003/05/soap-encoding">' +
        `      <UserName xsi:type="xsd:string">${login}</UserName>` +
        `      <Password xsi:type="xsd:string">${password}</Password>` +
        '      <IPs xsi:type="xsd:string"/>' +
        '    </ns1:Login>' +
        '  </env:Body>' +
        '</env:Envelope>'

    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4) {
            if (xmlhttp.status === 200) {
                manageSuccess(xmlhttp)
            } else {
                manageError("Sorry, try later")
            }
        }
    }

    xmlhttp.setRequestHeader('Content-Type', 'text/xml; charset=utf-8');
    xmlhttp.setRequestHeader('Access-Control-Allow-Origin', '*');
    xmlhttp.send(body);
}

window.addEventListener("load", (event) => {
    const loginForm = document.getElementById("login-form")

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault()

        const formData = new FormData(e.target)
        const formProps = Object.fromEntries(formData)

         soapLogin(formProps.login, formProps.password)
    }, false);
});