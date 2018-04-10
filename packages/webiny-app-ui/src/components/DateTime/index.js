import React from "react";
import _ from "lodash";
import { i18n, createComponent } from "webiny-app";
import { FormComponent } from "webiny-app-ui";
import styles from "./styles.css";

class DateTime extends React.Component {
    constructor(props) {
        super(props);
        this.initialized = false;
        this.state = {
            ...props.initialState
        };

        this.init = this.init.bind(this);
    }

    componentDidMount() {
        this.props.attachToForm && this.props.attachToForm(this);
    }

    init(element) {
        if (this.initialized) {
            return;
        }

        this.initialized = true;
        element.flatpickr({
            defaultDate: this.props.value,
            enableTime: true,
            time_24hr: true,
            formatDate: date => {
                // Here we have a date object, in user's tz, so we can directly pass it into i18n.dateTime.
                // In getInputValue method, we have a string, so we'll need to create a Date instance first.
                return i18n.dateTime(date, this.getInputFormat());
            },
            onChange: values => {
                let value = values[0];
                if (value) {
                    value = value.toISOString();
                }
                this.props.onChange(value, this.validate);
            }
        });
    }

    getInputFormat() {
        return this.props.inputFormat || i18n.getDateTimeFormat();
    }

    getInputValue() {
        if (_.isEmpty(this.props.value)) {
            return "";
        }

        // Here we have a "toISOString" string, in UTC, so we have to create an instance of Date, so user's tz is applied.
        // In flatpickr's "formatDate" function, we receive Date object directly, so no additional actions were needed.
        return i18n.dateTime(new Date(this.props.value), this.getInputFormat());
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { InputLayout } = this.props.modules;

        const props = {
            onBlur: this.props.validate ? this.props.validate : this.props.onBlur,
            disabled: this.props.isDisabled(),
            readOnly: this.props.readOnly,
            type: "text",
            value: this.getInputValue(),
            placeholder: this.props.placeholder,
            onChange: this.props.onChange,
            autoFocus: this.props.autoFocus,
            className: styles.input,
            ref: ref => {
                this.init(ref);
                this.props.onRef(ref);
            }
        };

        return (
            <InputLayout
                iconRight="icon-calendar"
                valid={this.state.isValid}
                className={this.props.className}
                input={<input {...props} />}
                label={this.props.renderLabel.call(this)}
                description={this.props.renderDescription.call(this)}
                info={this.props.renderInfo.call(this)}
                validationMessage={this.props.renderValidationMessage.call(this)}
            />
        );
    }
}

DateTime.defaultProps = {
    onRef: _.noop,
    inputFormat: null
};

export default createComponent([DateTime, FormComponent], {
    modulesProp: "modules",
    modules: ["Icon", "InputLayout", { flatpickr: "Vendor.FlatPickr" }],
    formComponent: true
});