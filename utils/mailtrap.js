const axios = require('axios');
const { MAILTRAP_ACCOUNT_ENDPOINT, MAILTRAP_ACCOUNT_ID, MAILTRAP_ACCOUNT_API_TOKEN } = process.env;

const createContact = async () => {
    const options = {
        method: 'POST',
        url: `${MAILTRAP_ACCOUNT_ENDPOINT}${MAILTRAP_ACCOUNT_ID}/contacts`,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Api-Token': MAILTRAP_ACCOUNT_API_TOKEN
        },
        data: {
            contact: {
                email: 'nickkuts888@gmail.com',
                fields: {first_name: 'Микола', last_name: 'Куц'},
                list_ids: [3199]
            }
        }
    };

    try {
        const { data } = await axios.request(options);
        console.log(data);
    } catch (error) {
        console.error(error.response.status, error.response.data);
    }
};

const getContactLists = async () => {   
    const options = {
        method: 'GET',
        url: `${MAILTRAP_ACCOUNT_ENDPOINT}${MAILTRAP_ACCOUNT_ID}/contacts/lists`,
        headers: {
            Accept: 'application/json',
            'Api-Token': MAILTRAP_ACCOUNT_API_TOKEN
        }
    };

    try {
        const { data } = await axios.request(options);
        console.log(data);
    } catch (error) {
        console.error(error.response.status, error.response.data);
    }
};

module.exports = { createContact, getContactLists };

// createContact();
// getContactLists();
// node utils/mailtrap.js