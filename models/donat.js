const { Schema, model } = require('mongoose');

const donatSchema = new Schema({
    data: {
        type: Schema.Types.Object,
    },
}, {versionKey: false, timestamps: true});

const Donat = model('Donat', donatSchema);

module.exports = {Donat};