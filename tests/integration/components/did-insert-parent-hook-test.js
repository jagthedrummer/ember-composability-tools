import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import { timeout } from 'ember-concurrency';

module(
  'Integration | Component | didInsertParent hook runs in the correct order',
  function (hooks) {
    setupRenderingTest(hooks);

    test('top-level parent and two children', async function (assert) {
      let parentSpy = (this.parentSpy = sinon.spy());
      let childSpy = (this.childSpy = sinon.spy());

      await render(hbs`
      <Root @didInsertParent={{this.parentSpy}} as |Node|>
        <Node @didInsertParent={{this.childSpy}}/>
        <Node @didInsertParent={{this.childSpy}}/>
      </Root>
    `);

      assert.ok(parentSpy.calledOnce, 'parent didInsertParent was called once');
      assert.ok(childSpy.calledTwice, 'child didInsertParent was called twice');
      assert.ok(
        parentSpy.calledBefore(childSpy),
        'parent was called before child',
      );
    });

    test('top-level parent and two children after if', async function (assert) {
      let parentSpy = (this.parentSpy = sinon.spy());
      let childSpy = (this.childSpy = sinon.spy());
      this.show = false;

      await render(hbs`
      <Root @didInsertParent={{this.parentSpy}} as |Node|>
        {{#if this.show}}
          <Node @didInsertParent={{this.childSpy}}/>
          <Node @didInsertParent={{this.childSpy}}/>
        {{/if}}
      </Root>
    `);

      assert.ok(parentSpy.calledOnce, 'parent didInsertParent was called once');
      assert.notOk(childSpy.called, 'child didInsertParent was never called');

      this.set('show', true);

      assert.ok(parentSpy.calledOnce, 'parent didInsertParent was called once');
      assert.ok(childSpy.calledTwice, 'child didInsertParent was called twice');
      assert.ok(
        parentSpy.calledBefore(childSpy),
        'parent was called before child',
      );
    });

    test('top-level parent and two children-parents', async function (assert) {
      let parentSpy = (this.parentSpy = sinon.spy());
      let childSpy = (this.childSpy = sinon.spy());
      let childParentSpy = (this.childParentSpy = sinon.spy());

      await render(hbs`
      <Root @didInsertParent={{this.parentSpy}} as |NodeA|>
        <NodeA @didInsertParent={{this.childParentSpy}} as |NodeB|>
          <NodeB @didInsertParent={{this.childSpy}}/>
          <NodeB @didInsertParent={{this.childSpy}}/>
        </NodeA>
      </Root>
    `);

      assert.ok(parentSpy.calledOnce, 'parent didInsertParent was called once');
      assert.ok(
        childParentSpy.calledOnce,
        'child-parent didInsertParent was called once',
      );
      assert.ok(childSpy.calledTwice, 'child didInsertParent was called twice');
      assert.ok(
        parentSpy.calledBefore(childParentSpy),
        'parent was called before child-parent',
      );
      assert.ok(
        childParentSpy.calledBefore(childSpy),
        'child-parent was called before child',
      );
      assert.ok(
        parentSpy.calledBefore(childSpy),
        'parent was called before child',
      );
    });

    test('top-level parent and two children-parents after if', async function (assert) {
      let parentSpy = (this.parentSpy = sinon.spy());
      let childSpy = (this.childSpy = sinon.spy());
      let childParentSpy = (this.childParentSpy = sinon.spy());
      this.show = false;

      await render(hbs`
      <Root @didInsertParent={{this.parentSpy}} as |NodeA|>
        {{#if this.show}}
          <NodeA @didInsertParent={{this.childParentSpy}} as |NodeB|>
            <NodeB @didInsertParent={{this.childSpy}}/>
            <NodeB @didInsertParent={{this.childSpy}}/>
          </NodeA>
        {{/if}}
      </Root>
    `);

      assert.ok(parentSpy.calledOnce, 'parent didInsertParent was called once');
      assert.notOk(
        childParentSpy.called,
        'child-parent didInsertParent was never called',
      );
      assert.notOk(childSpy.called, 'child didInsertParent was never called');

      this.set('show', true);

      assert.ok(parentSpy.calledOnce, 'parent didInsertParent was called once');
      assert.ok(
        childParentSpy.calledOnce,
        'child-parent didInsertParent was called once',
      );
      assert.ok(childSpy.calledTwice, 'child didInsertParent was called twice');
      assert.ok(
        parentSpy.calledBefore(childParentSpy),
        'parent was called before child-parent',
      );
      assert.ok(
        childParentSpy.calledBefore(childSpy),
        'child-parent was called before child',
      );
      assert.ok(
        parentSpy.calledBefore(childSpy),
        'parent was called before child',
      );
    });

    test('top-level parent and two children with async callbacks', async function (assert) {
      let parentSpy = (this.parentSpy = sinon.spy());
      let childSpy = (this.childSpy = sinon.spy());
      let functionCalls = [];
      let asyncCallbackFunction = (this.asyncCallbackFunction = async (functionId) => {
        await timeout(100);
        functionCalls.push(functionId);
        this.parentSpy();
      })
      let asyncChildCallbackFunction = (this.asyncChildCallbackFunction = async (functionId) => {
        await timeout(100);
        functionCalls.push(functionId);
        this.childSpy();
      })
      let nonAsyncChildCallbackFunction = (this.nonAsyncChildCallbackFunction = (functionId) => {
        functionCalls.push(functionId);
        this.childSpy();
      })

      await render(hbs`
      <Root @didInsertParent={{fn this.asyncCallbackFunction 'p1'}} as |Node|>
        <Node @didInsertParent={{fn this.asyncChildCallbackFunction 'c1'}}/>
        <Node @didInsertParent={{fn this.nonAsyncChildCallbackFunction 'c2'}}/>
      </Root>
    `);

      assert.ok(this.parentSpy.calledOnce, 'parent didInsertParent was called once');
      assert.ok(this.childSpy.calledTwice, 'child didInsertParent was called twice');
      assert.ok(
        parentSpy.calledBefore(childSpy),
        'parent was called before child',
      );
      assert.deepEqual(functionCalls,['p1', 'c1', 'c2'],'callbacks fired in the proper order')
    });

  },
);
