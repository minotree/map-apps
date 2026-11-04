describe('Login Page', () => {
  it('displays the login form', () => {
    cy.visit('/');

    cy.get('ion-input.login-input').should('have.length', 2);
    cy.get('ion-button.login-button').should('be.visible');
  });
});

