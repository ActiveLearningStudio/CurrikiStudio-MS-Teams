// An authentication service that uses the MSAL.js library to sign in users with
// either an AAD or MSA account. This leverages the AAD v2 endpoint.
class MsalAuthService {
    constructor(clientId, applicationIdUri) {
        this.api = applicationIdUri;

        this.app = new msal.PublicClientApplication({
            auth: {
                clientId: clientId,
                redirectUri: `${window.location.origin}/Home/BrowserRedirect`,
            },
        });
    }

    isCallback() {
        return this.app.handleRedirectPromise().then((authResponse) => {
            if (authResponse) {
                this.app.setActiveAccount(authResponse.account);
                return true;
            } else {
                return false;
            }
        });
    }

    login() {
        // Configure all the scopes that this app needs
        const loginScopes = [
            "openid",
            "email",
            "profile",
            "offline_access",
            "User.Read"
        ];

        const authRequest = {
            scopes: loginScopes,
            prompt: "select_account",
        };

        if (window.navigator.standalone) {
            return this.app.loginRedirect(authRequest);
        } else {
            return this.app.loginPopup(authRequest).then((authResponse) => {
                this.app.setActiveAccount(authResponse.account);
                
                return authResponse.account;
            });
        }
    }

    logout() {
        this.app.logout();
    }

    getUser() {
        let activeAccount = this.app.getActiveAccount();
        if (!activeAccount) {
            const allAccounts = this.app.getAllAccounts();
            if (allAccounts.length === 1) {
                this.app.setActiveAccount(allAccounts[0]);
                activeAccount = allAccounts[0];
            }
        }

        return Promise.resolve(activeAccount);
    }

    getToken() {
        const scopes = [this.api];
        
        return this.app
            .acquireTokenSilent({ account: this.app.getActiveAccount() })
            .then((authResponse) => authResponse.accessToken)
            .catch((error) => {
                if (error.errorMessage.indexOf("interaction_required") >= 0) {
                    return this.app
                        .acquireTokenPopup({ scopes })
                        .then((authResponse) => authResponse.accessToken);
                } else {
                    return Promise.reject(error);
                }
            });
    }

    getUserInfo(principalName) {
        this.getToken().then((token) => {
            if (principalName) {
                let graphUrl = "https://graph.microsoft.com/v1.0/users/" + principalName;

                $.ajax({
                    url: graphUrl,
                    type: "GET",
                    beforeSend: function (request) {
                        request.setRequestHeader("Authorization", `Bearer ${token}`);
                    },
                    success: function (jsonParse) {

                        // var jsonParse = JSON.parse(jsonResult);
                        var email = jsonParse['mail'];
                        //var email = 'abc@example.com'
                        var first_name = jsonParse['givenName'];
                        //var first_name = 'abc'
                        var last_name = jsonParse['surname'];
                        //var last_name = 'cde'
                        var lti_client_id = '48014f34-d3d3-495a-b9bc-a694f2fe191d';
                        var tool_platform = 'msteams';
                        var tempGuid = 'b3c6-2405-201-e005-35-7008-5011-939f-9977';

                        var plainQueryString = 'email='+ email + '&first_name='+ first_name +  '&last_name='+ last_name + '&lti_client_id='+ lti_client_id +  '&tool_platform='+ tool_platform  +  '&guid='+ tempGuid
                        //display(plainQueryString);
                        var base64EncodedString = btoa(plainQueryString);
                        //display(base64EncodedString);
                        window.location='https://dev.currikistudio.org/canvas-lti-sso?sso_info='+ base64EncodedString;
                    },
                    error: function (error) {
                        console.log("Failed");
                        console.log(error);
                    },
                    complete: function (data) {
                    }
                });
            }
        });
    }
}