import angularJson from '../angular.json';

describe('angular.json build options', () => {
  const scripts: string[] = angularJson.projects['dspace-angular'].architect.build.options.scripts;

  it('should bundle the licence selector scripts', () => {
    expect(scripts).toContain('src/license-selector.js');
    expect(scripts).toContain('src/license-selector-creation.js');
  });
});
