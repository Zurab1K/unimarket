import useMultistepForms from "@/app/useMultistepForms"
import { relative } from "path"

const onboardingSurvey = () => {
    const {steps, currentStepIndex, step, isFirstStep, isLastStep, back, next} = useMultistepForms([
        <div>One</div>, <div>Two</div>
    ])
    return <div style={{
        position: "relative",
        background: "white",
        border: "1px solid black",
        padding: "2rem",
        margin: "1rem",
        borderRadius: ".5rem",
        fontFamily: "Arial",
    }}>
        <form>
            <div style = {{
                position: "absolute",
                top: ".5rem",
                right: ".5rem",
            }}>
                {currentStepIndex + 1} / {steps.length}
            </div>
            {step}
            <div style = {{
                marginTop: "1rem",
                display: "flex",
                gap: ".5rem",
                justifyContent: "flex-end",
            }}></div>
            {!isFirstStep && <button type="button" onClick={back}>Back</button>}
            {isLastStep ? <button type="submit">Finish</button> : <button type="button" onClick={next}>Next</button>}
        </form>
    </div>
}

export default onboardingSurvey