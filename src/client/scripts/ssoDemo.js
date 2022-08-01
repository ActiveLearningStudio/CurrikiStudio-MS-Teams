(function () {
    'use strict';

    // 1. Get auth token
    // Ask Teams to get us a token from AAD
    function getClientSideToken() {

        return new Promise((resolve, reject) => {
           // display("1. Get auth token from Microsoft Teams");
            display("Connecting the curriki studio please wait...")
            microsoftTeams.authentication.getAuthToken().then((result) => {
                display(result);

                resolve(result);
            }).catch((error) => {
                reject("Error getting token: " + error);
            });
        });
    }

    // 2. Exchange that token for a token with the required permissions
    //    using the web service (see /auth/token handler in app.js)
    function getServerSideToken(clientSideToken) {
        return new Promise((resolve, reject) => {
            microsoftTeams.app.getContext().then((context) => {
                fetch('/getProfileOnBehalfOf', {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        'tid': context.user.tenant.id,
                        'token': clientSideToken
                    }),
                    mode: 'cors',
                    cache: 'default'
                })
                .then((response) => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        reject(response.error);
                    }
                })
                .then((responseJson) => {
                    if (responseJson.error) {
                        reject(responseJson.error);
                    } else {
                        const profile = responseJson;

                        resolve(profile);
                    }
                });
            });
        });
    }

    // 3. Get the server side token and use it to call the Graph API
    function useServerSideToken(data) {

        //display("2. Call https://graph.microsoft.com/v1.0/me/ with the server side token");
        var jsonResult = JSON.stringify(data, undefined, 4);
        callExternalApp(jsonResult);
        return display(JSON.stringify(data, undefined, 4), 'pre');
    }

    // Show the consent pop-up
    function requestConsent() {
        return new Promise((resolve, reject) => {
            microsoftTeams.authentication.authenticate({
                url: window.location.origin + "/auth-start",
                width: 600,
                height: 535
            })
            .then((result) => {
                let data = localStorage.getItem(result);
                localStorage.removeItem(result);

                resolve(data);
            }).catch((reason) => {
                reject(JSON.stringify(reason));
            });
        });
    }

    // Add text to the display in a <p> or other HTML element
    function display(text, elementTag) {
        var logDiv = document.getElementById('logs');
        var p = document.createElement(elementTag ? elementTag : "p");
        p.innerText = text;
        logDiv.append(p);
        console.log("ssoDemo: " + text);
        return p;
    }

    function callExternalApp(jsonResult){
        //display("4. Call curriki studio");
            //display(jsonResult);
            var jsonParse = JSON.parse(jsonResult);
            var email = jsonParse['mail'];
            //var email = 'uday@flyerssoft.com'
            var first_name = jsonParse['givenName'];
            //var first_name = 'Uday'
            var last_name = jsonParse['surname'];
            //var last_name = 'Kanth'
            var lti_client_id = '7db24d1d-9dcb-4084-94bd-96ec6775bb25'; 
            var tool_platform = 'msteams';
            var tempGuid = 'b3c6-2405-201-e005-35-7008-5011-939f-9977';   

            var plainQueryString = 'email='+ email + '&first_name='+ first_name +  '&last_name='+ last_name + '&lti_client_id='+ lti_client_id +  '&tool_platform='+ tool_platform  +  '&guid='+ tempGuid 
            //display(plainQueryString);
            var base64EncodedString = btoa(plainQueryString);
            //display(base64EncodedString);
            window.location='https://dev.currikistudio.org/canvas-lti-sso?sso_info='+ base64EncodedString;
    }

    // In-line code
    $(document).ready(function () {
        microsoftTeams.app.initialize().then(() => {
            getClientSideToken()
                .then((clientSideToken) => {
                    return getServerSideToken(clientSideToken);
                })
                .then((profile) => {
                    return useServerSideToken(profile);
                })
                .catch((error) => {
                    if (error === "invalid_grant") {
                        display(`Error: ${error} - user or admin consent required`);

                        // Display in-line button so user can consent
                        let button = display("Consent", "button");
                        button.onclick = (() => {
                            requestConsent()
                                .then((result) => {
                                    // Consent succeeded
                                    display(`Consent succeeded`);

                                    // offer to refresh the page
                                    button.disabled = true;
                                    let refreshButton = display("Refresh page", "button");
                                    refreshButton.onclick = (() => { window.location.reload(); });
                                })
                                .catch((error) => {
                                    display(`ERROR ${error}`);

                                    // Consent failed - offer to refresh the page
                                    button.disabled = true;
                                    let refreshButton = display("Refresh page", "button");
                                    refreshButton.onclick = (() => { window.location.reload(); });
                                });
                        });
                    } else {
                        // Something else went wrong
                        display(`Error from web service: ${error}`);
                    }
                });
        }).catch((error) => {
            console.error(error);
        });
    });

})();
