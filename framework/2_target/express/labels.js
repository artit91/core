
function _(template) {
    return (msgParams) => {
        with (msgParams) {
            return eval(`\`${template}\``);
        }
    }
}

module.exports = {
    'parameter_required': _('Parameter \'${paramName}\' required!'),
};
