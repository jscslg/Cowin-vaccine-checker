"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
const axios_1 = __importDefault(require("axios"));
const chalk_1 = __importDefault(require("chalk"));
const beeper = require("beeper");
const { validateState, validateDistrict, validateNumber } = require("./util/validators");
axios_1.default.defaults.baseURL = "https://www.cowin.gov.in/api/v2";
const questions = [
    {
        name: "state",
        message: "Enter your State",
        validate: validateState,
    },
    {
        name: "district",
        message: "Enter your district",
        validate: validateDistrict,
    },
    {
        name: "age",
        message: "Enter your age",
        validate: validateNumber,
    },
];
let input;
let num = 1;
let state_id = 0;
let district_id = 0;
inquirer_1.default
    .prompt(questions)
    .then((answers) => {
    input = answers;
    return axios_1.default.get(`/admin/location/states`);
})
    .then((res) => {
    res.data.states.forEach((cur) => {
        if (cur.state_name.toLowerCase() === input.state.toLowerCase()) {
            state_id = cur.state_id;
        }
    });
    if (state_id === 0)
        return Promise.reject("ERROR: State Not Found");
    return axios_1.default.get(`/admin/location/districts/${state_id}`);
})
    .then((res) => {
    res.data.districts.forEach((cur) => {
        if (cur.district_name.toLowerCase() === input.district.toLowerCase()) {
            district_id = cur.district_id;
        }
    });
    if (district_id === 0)
        return Promise.reject("ERROR: District Not Found");
    checkVaccine();
})
    .catch((err) => {
    console.error(chalk_1.default.red(err));
});
const checkVaccine = () => {
    console.log(chalk_1.default.gray(`Fetching API - ${num++}`));
    let date = new Date();
    let dd = String(date.getDate()).padStart(2, '0'), mm = String(date.getMonth() + 1).padStart(2, '0'), yyyy = date.getFullYear();
    let today = `${dd}-${mm}-${yyyy}`;
    let availableCenters = [];
    axios_1.default.get(`/appointment/sessions/public/calendarByDistrict`, {
        params: {
            district_id: district_id,
            date: today,
        },
    })
        .then((res) => {
        res.data.centers.forEach(center => {
            center.sessions.forEach(session => {
                if (session.available_capacity > 0 && session.date === today && session.min_age_limit <= input.age) {
                    availableCenters.push({
                        "center": center.name,
                        "address": center.address,
                        "pincode": center.pincode,
                        "fees": center.fee_type,
                        "vaccine": session.vaccine,
                        "slots": session.slots
                    });
                }
            });
        });
        if (availableCenters.length > 0) {
            beep();
            console.log(chalk_1.default.greenBright.bold.underline("SLOTS AVAILABLE -"));
            availableCenters.forEach(obj => printCenterInfo(obj));
        }
        else
            console.log(chalk_1.default.yellow("NO SLOTS AVAILABLE"));
    })
        .catch((err) => {
        console.error(err);
    });
    setTimeout(checkVaccine, 60000);
};
const printCenterInfo = (obj) => {
    console.log(chalk_1.default.blue(`\nCenter: Name - ${obj.center} Address - ${obj.address} Pincode - ${obj.pincode} Fees - ${obj.fees}`));
    console.log(chalk_1.default.blue(`Vaccine - ${obj.vaccine}\nSlots - ${obj.slots}\n`));
};
const beep = () => __awaiter(void 0, void 0, void 0, function* () { return yield beeper(3); });
//# sourceMappingURL=index.js.map