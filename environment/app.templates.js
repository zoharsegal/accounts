/**
 * Templates by mapp
 */
module.exports = {
    account:{
        emailActivation:{
            lang_12:{
                title:"{appName} Activate Your Account",
                content:"Hello {firstName} {lastName}, Please Activate Your Account<br> To Activate Click <a href='{activationUrl}'>Here</a>"
            },
            lang_13:{
                title:"{appName} הפעל את חשבונך",
                content:"להפעלה {activationUrl} <br>שלום {firstName} {lastName}, הפעל את חשבונך"
            }
        }
    },
    getTemplateByLang:function(app,templateId,langId,element) {
        return this[app][templateId]["lang_" + langId][element]
    },

};