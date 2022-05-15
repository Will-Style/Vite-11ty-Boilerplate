import '~/scss/style.scss'

import * as Model from "~/js/models/"
import * as Transition from "~/js/transitions/"


const Initialize = () => {
    if(import.meta.env.VITE_USE_BARBA){
        new Transition.Barba
    }
}
const DOMLoaded = () => {
    if(import.meta.env.VITE_USE_BARBA){
        new Model.Tab
    }
}

const WindowOnLoad = () => {
    if(!import.meta.env.VITE_USE_BARBA){
        new Model.Tab
    }
}

Initialize();

document.addEventListener('DOMContentLoaded', DOMLoaded, false);

window.addEventListener('load', WindowOnLoad, false);
