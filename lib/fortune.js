//定義幸運餅乾陣列
const fortuneCookies = [
    "Conquer your fears or they will conquer you .",
    "Rivers need springs.",
    "Do not fear what you don't know.",
    "You will have a pleasang surprise.",
    "Wheneer possible, keep it simple"
]

exports.getFortune = () =>{
    const idx = Math.floor(Math.random()*fortuneCookies.length);
    return fortuneCookies[idx];
}