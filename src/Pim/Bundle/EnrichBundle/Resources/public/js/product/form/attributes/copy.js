'use strict';

define(
    [
        'underscore',
        'pim/form',
        'text!pim/template/product/tab/attribute/copy',
        'pim/product-edit-form/attributes/copyfield',
        'pim/config-manager',
        'pim/attribute-manager'
    ],
    function(_, BaseForm, template, CopyField, ConfigManager, AttributeManager) {
        return BaseForm.extend({
            template: _.template(template),
            className: 'attribute-copy-actions',
            copyFields: {},
            copying: false,
            locale: null,
            scope: null,
            events: {
                'click .start-copying': 'startCopying',
                'click .stop-copying':  'stopCopying',
                'click .copy':  'copy'
            },
            initialize: function() {
                this.copyFields = {};

                BaseForm.prototype.initialize.apply(this, arguments);
            },
            configure: function () {
                return BaseForm.prototype.configure.apply(this, arguments);
            },
            render: function () {
                if (this.copying) {
                    this.getParent().$el.addClass('comparision-mode');
                } else {
                    this.getParent().$el.removeClass('comparision-mode');
                }

                this.$el.html(
                    this.template({
                        state: this.getRoot().state.toJSON(),
                        'copying': this.copying
                    })
                );

                if (this.copying) {
                    _.each(this.copyFields, _.bind(function (copyField, code) {
                        var field = this.getParent().renderedFields[code];
                        if (field) {
                            copyField.setField(field);
                            copyField.field.addElement('comparision', 'copy', copyField.render().$el);
                        }

                    }, this));

                    this.renderExtensions();
                }

                this.delegateEvents();

                return this;
            },
            generateCopyFields: function() {
                this.copyFields = {};

                ConfigManager.getEntityList('attributes').done(_.bind(function(attributes) {
                    _.each(this.getData().values, _.bind(function (values, code) {
                        var attribute = attributes[code];

                        if (attribute.scopable || attribute.localizable) {
                            var valueToCopy = AttributeManager.getValue(values, attribute, this.locale, this.scope);

                            var copyField = new CopyField();
                            if (
                                this.copyFields[code] &&
                                this.copyFields[code].locale === valueToCopy.locale &&
                                this.copyFields[code].scope === valueToCopy.scope
                            ) {
                                copyField = this.copyFields[code];
                                copyField.setSelected(this.copyFields[code].selected);
                            }

                            copyField.setLocale(valueToCopy.locale);
                            copyField.setScope(valueToCopy.scope);
                            copyField.setData(valueToCopy.value);

                            this.copyFields[code] = copyField;
                        }
                    }, this));
                }, this));
            },
            copy: function(){
                _.each(this.copyFields, function (copyField) {
                    if (copyField.field) {
                        copyField.field.setCurrentValue(copyField.data);
                        copyField.selected = false;
                    }
                });

                this.getParent().render();
            },
            startCopying: function() {
                this.copying = true;
                this.generateCopyFields();

                this.render();
            },
            stopCopying: function() {
                this.copying = false;

                _.each(this.copyFields, _.bind(function(copyField) {
                    if (copyField.field) {
                        copyField.field.removeElement('comparision', 'copy');
                    }
                }, this));

                this.copyFields = {};
                this.render();
            },
            setLocale: function(locale) {
                this.locale = locale;

                this.generateCopyFields();
                this.render();
            },
            setScope: function(scope) {
                this.scope = scope;

                this.generateCopyFields();
                this.render();
            },
            getLocale: function() {
                return this.locale;
            },
            getScope: function() {
                return this.scope;
            }
        });
    }
);
