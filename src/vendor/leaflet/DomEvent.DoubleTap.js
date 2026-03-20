import * as DomEvent from "leaflet/src/dom/DomEvent.js";

const COPY_PROPS = [
    "altKey",
    "bubbles",
    "button",
    "buttons",
    "cancelable",
    "changedTouches",
    "clientX",
    "clientY",
    "ctrlKey",
    "currentTarget",
    "defaultPrevented",
    "detail",
    "metaKey",
    "pageX",
    "pageY",
    "pointerId",
    "pointerType",
    "relatedTarget",
    "screenX",
    "screenY",
    "shiftKey",
    "sourceCapabilities",
    "srcElement",
    "target",
    "targetTouches",
    "timeStamp",
    "touches",
    "view",
    "which",
];

const COPY_METHODS = [
    "composedPath",
    "preventDefault",
    "stopImmediatePropagation",
    "stopPropagation",
];

function makeDblclick(event) {
    const newEvent = {};

    for (const key of COPY_PROPS) {
        if (key in event) {
            newEvent[key] = event[key];
        }
    }

    for (const key of COPY_METHODS) {
        if (typeof event[key] === "function") {
            newEvent[key] = event[key].bind(event);
        }
    }

    newEvent.type = "dblclick";
    newEvent.detail = 2;
    newEvent.isTrusted = false;
    newEvent._simulated = true;

    return newEvent;
}

const delay = 200;

export function addDoubleTapListener(obj, handler) {
    obj.addEventListener("dblclick", handler);

    let last = 0;
    let detail;

    function simDblclick(e) {
        if (e.detail !== 1) {
            detail = e.detail;
            return;
        }

        if (
            e.pointerType === "mouse" ||
            (e.sourceCapabilities && !e.sourceCapabilities.firesTouchEvents)
        ) {
            return;
        }

        const path = DomEvent.getPropagationPath(e);
        if (
            path.some(
                (el) => el instanceof HTMLLabelElement && el.attributes.for,
            ) &&
            !path.some(
                (el) =>
                    el instanceof HTMLInputElement ||
                    el instanceof HTMLSelectElement,
            )
        ) {
            return;
        }

        const now = Date.now();
        if (now - last <= delay) {
            detail++;
            if (detail === 2) {
                handler(makeDblclick(e));
            }
        } else {
            detail = 1;
        }
        last = now;
    }

    obj.addEventListener("click", simDblclick);

    return {
        dblclick: handler,
        simDblclick,
    };
}

export function removeDoubleTapListener(obj, handlers) {
    obj.removeEventListener("dblclick", handlers.dblclick);
    obj.removeEventListener("click", handlers.simDblclick);
}
