import fs from "fs";

import dotenv from "dotenv";
dotenv.config()
import axios from "axios";

const processArgs = (args) => {
    if (args.length < 2) {
        throw new Error(`not enough args, an operation and interaction name are both required`)
    }

    switch (args[0]) {
        case "create":
        case "update":
        case "delete":
            break;
        default:
            throw new Error(`invalid operation "${args[0]}"`)
    }

    return [
        args[0],
        JSON.parse(
            fs.readFileSync(
                `./interactions/${args[1]}.json`,
                { encoding: "utf-8" }
            )
        )
    ];
}

var args = process.argv.slice(2);
const [operation, data] = processArgs(args);
const applicationId = process.env.DISCORD_APP_ID;
const applicationTokenType = process.env.DISCORD_APP_TOKEN_TYPE;
const applicationToken = process.env.DISCORD_APP_TOKEN;
const url = `https://discord.com/api/v8/applications/${applicationId}/commands`;
const headers = {
    "Authorization": `${applicationTokenType} ${applicationToken}`
};

let response;
switch (operation) {
    case "create":
        if (data.meta.id !== "") {
            throw new Error(`interaction "${data.interaction.name}" already exists and has an ID: update the existing interaction or delete this one first`)
        }
        response = await axios.post(url, data.interaction, { headers });
        if (response.status < 200 || response.status > 299) {
            console.error(response.data);
            throw new Error(`failed with status ${response.status}`);
        }
        data.meta.id = response.data.id;
        data.meta.application_id = response.data.application_id;
        data.meta.version = response.data.version;
        break;
    case "update":
        if (data.meta.id === "") {
            throw new Error(`interaction "${data.interaction.name}" doesn't exist: create it first`)
        }
        response = await axios.patch(`${url}/${data.meta.id}`, data.interaction, { headers });
        if (response.status < 200 || response.status > 299) {
            console.error(response.data);
            throw new Error(`failed with status ${response.status}`);
        }
        data.meta.version = response.data.version;
        break;
    case "delete":
        if (data.meta.id === "") {
            throw new Error(`interaction "${data.interaction.name}" doesn't exist: create it first`)
        }
        response = await axios.delete(`${url}/${data.meta.id}`, { headers });
        if (response.status < 200 || response.status > 299) {
            console.error(response.data);
            throw new Error(`failed with status ${response.status}`);
        }
        data.meta.id = "";
        data.meta.application_id = "";
        data.meta.version = "";
        break;
        
}

fs.writeFileSync(`./interactions/${args[1]}.json`, JSON.stringify(data, null, 2), { encoding: "utf-8" });