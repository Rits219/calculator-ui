
const numberA = document.getElementById("numberA");
const numberB = document.getElementById("numberB");
const baseUrl = document.getElementById("baseUrl");
const statusElement = document.getElementById("status");

const operations = {
    add: {
        buttonId: "addButton",
        resultId: "addResult",
        equationId: "addEquation",
        symbol: "+",
        label: "Add"
    },
    subtract: {
        buttonId: "subtractButton",
        resultId: "subtractResult",
        equationId: "subtractEquation",
        symbol: "−",
        label: "Subtract"
    },
    multiply: {
        buttonId: "multiplyButton",
        resultId: "multiplyResult",
        equationId: "multiplyEquation",
        symbol: "×",
        label: "Multiply"
    },
    devide: {
        buttonId: "divideButton",
        resultId: "divideResult",
        equationId: "divideEquation",
        symbol: "÷",
        label: "Divide"
    }
};

Object.entries(operations).forEach(([operation, config]) => {
    document.getElementById(config.buttonId)
        .addEventListener("click", () => calculate(operation));
});

async function calculate(operation) {
    const aValue = numberA.value;
    const bValue = numberB.value;

    if (aValue.trim() === "" || bValue.trim() === "") {
        showStatus("Please enter both numbers.", true);
        return;
    }

    const a = Number(aValue);
    const b = Number(bValue);

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
        showStatus("Please enter valid numbers.", true);
        return;
    }

    if (operation === "divide" && b === 0) {
        showStatus("Cannot divide by zero.", true);
        return;
    }

    const apiBase = baseUrl.value.trim().replace(/\/+$/, "");

    if (!apiBase) {
        showStatus("Please enter the API base URL.", true);
        return;
    }

    const config = operations[operation];
    const button = document.getElementById(config.buttonId);
    const url = `${apiBase}/calculator/${operation}`;

    setButtonsDisabled(true);
    button.textContent = `${config.label}ing...`;
    showStatus(`Calling ${url}...`);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ a, b })
        });

        const responseText = await response.text();

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}: ${responseText || response.statusText}`
            );
        }

        let data = responseText;

        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch {
                // The API may return plain text.
            }
        }

        const result = extractResult(data);

        if (result === undefined) {
            throw new Error("Could not find a result in the API response.");
        }

        document.getElementById(config.equationId)
            .firstChild.textContent =
                `${a} ${config.symbol} ${b} = `;

        document.getElementById(config.resultId).textContent = result;

        showStatus(`${config.label} successful! HTTP ${response.status}.`);
    } catch (error) {
        console.error(error);

        showStatus(
            error instanceof TypeError
                ? "Could not reach the API. Check the service and CORS settings."
                : error.message,
            true
        );
    } finally {
        setButtonsDisabled(false);

        Object.values(operations).forEach(config => {
            document.getElementById(config.buttonId).textContent =
                `${config.symbol} ${config.label}`;
        });
    }
}

function extractResult(data) {
    if (typeof data === "number" || typeof data === "string") {
        return data;
    }

    if (data && typeof data === "object") {
        for (const key of [
            "result", "value", "answer", "output",
            "sum", "difference", "product", "quotient"
        ]) {
            if (data[key] !== undefined && data[key] !== null) {
                return data[key];
            }
        }
    }

    return undefined;
}

function setButtonsDisabled(disabled) {
    Object.values(operations).forEach(config => {
        document.getElementById(config.buttonId).disabled = disabled;
    });
}

function showStatus(message, isError = false) {
    statusElement.textContent = message;
    statusElement.classList.toggle("error", isError);
}
