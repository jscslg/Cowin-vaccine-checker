import inquirer from "inquirer";
import axios from "axios";
import chalk from "chalk";
const beeper = require("beeper");
const { validateState, validateDistrict, validateNumber } =  require("./util/validators");

axios.defaults.baseURL = "https://www.cowin.gov.in/api/v2";

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

inquirer
	.prompt(questions)
	.then((answers) => {
		input = answers;
		return axios.get(`/admin/location/states`);
	})
	.then((res) => {
		res.data.states.forEach((cur) => {
			if (cur.state_name.toLowerCase() === input.state.toLowerCase()) {
				state_id = cur.state_id;
			}
		});
		if (state_id === 0) return Promise.reject("ERROR: State Not Found");
		return axios.get(`/admin/location/districts/${state_id}`);
	})
	.then((res) => {
		res.data.districts.forEach((cur) => {
			if (cur.district_name.toLowerCase() === input.district.toLowerCase()) {
				district_id = cur.district_id;
			}
		});
		if (district_id === 0) return Promise.reject("ERROR: District Not Found");
		checkVaccine();
	})
	.catch((err) => {
		console.error(chalk.red(err));
	});

const checkVaccine = () => {
    console.log(chalk.gray(`Fetching API - ${num++}`));
	let date = new Date();
	let dd = String(date.getDate()).padStart(2, '0'), mm = String(date.getMonth() + 1).padStart(2, '0'), yyyy = date.getFullYear();
	let today = `${dd}-${mm}-${yyyy}`;
    let availableCenters = [];
    axios.get(`/appointment/sessions/public/calendarByDistrict`, {
        params: {
            district_id: district_id,
            date: today,
        },
    })
    .then((res) => {
        res.data.centers.forEach(center => {
            center.sessions.forEach(session => {
                if(session.available_capacity>0 && session.date === today && session.min_age_limit<=input.age) {
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
        if(availableCenters.length>0){
			beep();
			console.log(chalk.greenBright.bold.underline("SLOTS AVAILABLE -"));
            availableCenters.forEach(obj => printCenterInfo(obj));
        }
        else console.log(chalk.yellow("NO SLOTS AVAILABLE"));
    })
    .catch((err) => {
		console.error(err);
    })
	setTimeout(checkVaccine,60000);
};

const printCenterInfo = (obj) => {
	console.log(chalk.blue(`\nCenter: Name - ${obj.center} Address - ${obj.address} Pincode - ${obj.pincode} Fees - ${obj.fees}`));
	console.log(chalk.blue(`Vaccine - ${obj.vaccine}\nSlots - ${obj.slots}\n`));
}

const beep = async () => await beeper(3);