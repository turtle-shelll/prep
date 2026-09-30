"use strict";

var myName = "Hardik";
let someThingChangable = "this value can be changed";
someThingChangable = 100;

const myDOB = "24-01-1997";

function whoIsMyNmae() {
    console.log("myName: ", myName);
    console.log("someThingChangable: ", someThingChangable);
};


console.log("1 ==>>", 1 === 1);
console.log("1 ==>>", 1 !== 1);
console.log("1 ==>>", 1 <= "1");
console.log("1 ==>>", 1 <= "111");
// console.log("1 ==>>", 1 += "111");

String.prototype.hideEmail = function () {
    const [email, domain] = this.split("@");
    const hindleEmail = email.replace(/.(?=.{3})/g, "*");
    return `${hindleEmail}@${domain}`;
};

const email1 = "Hardik.mistry@gmail.com";

console.log("[EMAIL_ADDRESS] ==>>", email1.hideEmail());


async function getApiData(...params) {
    console.log("params: ", params);
};

getApiData(1, 2, 3, 4, 5, 6, 7);


async function getApiData(...params) {
    console.log("params: ", params);
};


function myduplicatedFunc() { }
function myduplicatedFunc() { }
function myduplicatedFunc() { }
function myduplicatedFunc() { }

class myduplicatedFunc {
    #name;
    constructor(name) {
        // private this.name = "My Name is Hardik";
        this.name = name;
    };
};

const newClass = new myduplicatedFunc();
console.log("newClass == >>", newClass.name);

// const result = await getApiData(1, 2, 3, 4, 5, 6, 7);
// console.log("getApiData == >>", result);
