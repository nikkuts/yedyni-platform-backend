const axios = require('axios');
const {HttpError} = require('../helpers');
const courses = require('./courses.json');
require('dotenv').config();

const {USPACY_LOGIN, USPACY_PASS} = process.env;

const authUspacy = async () => {
    const authOptions = {
        method: 'POST',
        url: 'https://yedyni.uspacy.ua/auth/v1/auth/sign_in',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        data: { email: USPACY_LOGIN, password: USPACY_PASS }
    };

    try {
        const authResponse = await axios(authOptions);
        return authResponse.data.jwt;
    } catch (error) {
        console.error(error.response.status, error.response.data);
    }
};

const getContactByIdUspacy = async ({token, contactId}) => {
    const getContactOptions = {
        method: 'GET',
        url: `https://yedyni.uspacy.ua/crm/v1/entities/contacts/${contactId}`,
        headers: { 
            accept: 'application/json',
            authorization: `Bearer ${token}` 
        },
    };

    try {
        const response = await axios(getContactOptions);
        return response.data;
    } catch (error) {
        console.error(error.response.status, error.response.data);
    }
};

const getDealByIdUspacy = async ({token, dealId}) => {
    const getDealOptions = {
        method: 'GET',
        url: `https://yedyni.uspacy.ua/crm/v1/entities/deals/${dealId}`,
        headers: { 
            accept: 'application/json',
            authorization: `Bearer ${token}` 
        },
    };

    try {
        const response = await axios(getDealOptions);
        return response.data;
    } catch (error) {
        console.error(error.response.status, error.response.data);
    }
};

const createContactUspacy = async ({token, user, registration}) => {
    const createContactOptions = {
        method: 'POST',
        url: 'https://yedyni.uspacy.ua/crm/v1/entities/contacts',
        headers: { 
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: `Bearer ${token}` 
        },
      data: {
        ...user,
        title: `${user.last_name} ${user.first_name}`,
        email: [{ value: user.email }],
        phone: [{ value: user.phone }],
        registration,
      }
    };

    try {
        const response = await axios(createContactOptions);
        return response.data;
    } catch (error) {
        console.error(error.response.status, error.response.data);
    }
};

const createDealUspacy = async ({token, course, contactId}) => {
    const createDealOptions = {
        method: 'POST',
        url: 'https://yedyni.uspacy.ua/crm/v1/entities/deals',
        headers: { 
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: `Bearer ${token}` 
        },
      data: {
        title: course.title,
        funnel_id: course.funnelId,
        contacts: [contactId],
        hvilya: course.wave,
        amount_of_the_deal: {currency: "UAH", value: course.amount.toString()}
      }
    };

    try {
        const response = await axios(createDealOptions);
        return response.data;
    } catch (error) {
        console.error(error.response.status, error.response.data);
    }
};

const editContactUspacy = async ({token, contactId, user, registration}) => {
    const editContactOptions = {
        method: 'PATCH',
        url: `https://yedyni.uspacy.ua/crm/v1/entities/contacts/${contactId}`,
        headers: { 
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: `Bearer ${token}` 
        },
      data: {
        ...user,
        title: `${user.last_name} ${user.first_name}`,
        email: [{ value: user.email }],
        phone: [{ value: user.phone }],
        registration,
      }
    };

    try {
        const response = await axios(editContactOptions);
        return response.data;
    } catch (error) {
        console.error(error.response.status, error.response.data);
    }
};

const moveStageDealUspacy = async ({token, dealId, stageId}) => {
    const moveStageDealOptions = {
        method: 'POST',
        url: `https://yedyni.uspacy.ua/crm/v1/entities/deals/${dealId}/move/stage/${stageId}`,
        headers: { 
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: `Bearer ${token}` 
        }
    };

    try {
        const response = await axios(moveStageDealOptions);
        return response.data;
    } catch (error) {
        console.error(error.response.status, error.response.data);
    }
};

module.exports = { 
    authUspacy, 
    getContactByIdUspacy,
    getDealByIdUspacy,
    createContactUspacy,
    createDealUspacy,
    editContactUspacy, 
    moveStageDealUspacy
};