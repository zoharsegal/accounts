/**
 * Templates by mapp
 */
module.exports = {
    account:{
        emailActivation:{
            lang_12:{
                title:"{appName} Activate Your AppAPI",
                content:"Hello {firstName} {lastName}, Please Activate Your AppAPI<br> To Activate Click <a href='{activationUrl}'>Here</a>"
            },
            lang_13:{
                title:"{appName} הפעל את חשבונך",
                content:"להפעלה {activationUrl} <br>שלום {firstName} {lastName}, הפעל את חשבונך"
            }
        },
        forgotPassword:{
            lang_12:{
                title:"{appName} Reset Your Password",
                content:"Hello {firstName} {lastName}, To Reset Your Password<br> To Reset Click <a href='{forgotPasswordActivationUrl}'>Here</a>"
            },
            lang_13:{
                title:"{appName} אפס סיסמה",
                content:"להפעלה {forgotPasswordActivationUrl} <br>שלום {firstName} {lastName}, הפעל את חשבונך"
            }
        }
    },
    getTemplateByLang:function(app,templateId,langId,element) {
        return this[app][templateId]["lang_" + langId][element]
    },

};